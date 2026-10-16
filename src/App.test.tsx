// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { defaultState } from './storage';

const price = (label: string) => screen.getByLabelText(`Price of item ${label}`) as HTMLInputElement;
const qty = (label: string) => screen.getByLabelText(new RegExp(`^Amount in (g|ml) of item ${label}$`)) as HTMLInputElement;

async function fill(user: ReturnType<typeof userEvent.setup>, label: string, p: string, q: string) {
  await user.type(price(label), p);
  await user.type(qty(label), q);
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('App', () => {
  it('accepts only digits and a dot', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    await user.type(price('A'), '1a,2.3.4-5 ');
    expect(price('A').value).toBe('12.345');
  });

  it('shows the Result table only with two complete items and highlights rank 1', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await fill(user, 'A', '10', '10');
    expect(screen.queryByText('Result')).toBeNull();
    await fill(user, 'B', '15', '20');
    expect(screen.getByText('Result')).toBeTruthy();
    await fill(user, 'C', '25', '31.25');

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => within(r).getAllByRole('cell').map((c) => c.textContent))).toEqual([
      ['1', 'B', '15', '0.75', '0%'],
      ['2', 'C', '25', '0.80', '+6.7%'],
      ['3', 'A', '10', '1.00', '+33%'],
    ]);
    expect(rows[0].className).toBe('best');
    expect(qty('B').closest('.row')!.className).toContain('is-best');
    expect(qty('A').closest('.row')!.className).not.toContain('is-best');
  });

  it('deleting B shifts C up (relabelled), and Undo restores it', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await fill(user, 'A', '1', '1');
    await fill(user, 'B', '2', '2');
    await fill(user, 'C', '3', '4');

    await user.click(screen.getByRole('button', { name: 'Delete item B' }));
    expect(screen.queryByLabelText('Price of item C')).toBeNull();
    expect(price('B').value).toBe('3');
    expect(qty('B').value).toBe('4');
    expect(screen.getByText('Item B deleted')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(price('B').value).toBe('2');
    expect(price('C').value).toBe('3');
    expect(screen.queryByText('Item B deleted')).toBeNull();
  });

  it('deleting the last item clears it in place and focuses its price box', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    await fill(user, 'A', '1', '1');
    await fill(user, 'B', '2', '2');
    await user.click(screen.getByRole('button', { name: 'Delete item B' }));
    expect(price('A').value).toBe('1');
    expect(price('B').value).toBe('');
    expect(qty('B').value).toBe('');
    expect(document.activeElement).toBe(price('B'));
    expect(screen.getByText('Item B deleted')).toBeTruthy();
  });

  it('deleting A when only A and B exist keeps two rows', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    await fill(user, 'A', '1', '1');
    await fill(user, 'B', '2', '3');
    await user.click(screen.getByRole('button', { name: 'Delete item A' }));
    expect(price('A').value).toBe('2');
    expect(qty('A').value).toBe('3');
    expect(price('B').value).toBe('');
  });

  it('Clear resets to A and B and hides Result; Undo brings the data back', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await fill(user, 'A', '10', '10');
    await fill(user, 'B', '15', '20');
    expect(screen.getByText('Result')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByLabelText('Price of item C')).toBeNull();
    expect(price('A').value).toBe('');
    expect(screen.queryByText('Result')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(price('B').value).toBe('15');
    expect(screen.getByText('Result')).toBeTruthy();
  });

  it('limits the list to 10 items', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    const add = screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement;
    for (let i = 0; i < 8; i++) await user.click(add);
    expect(screen.getByLabelText('Price of item J')).toBeTruthy();
    expect(add.disabled).toBe(true);
  });

  it('persists data, language and theme in localStorage and restores them', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App initial={defaultState()} />);
    await fill(user, 'A', '10', '10');
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('radio', { name: 'TH' }));
    await user.click(screen.getByRole('radio', { name: /Midnight|เที่ยงคืน/ }));
    unmount();

    const saved = JSON.parse(localStorage.getItem('value-compare:state:v1')!);
    expect(saved.rows[0]).toEqual({ price: '10', qty: '10' });
    expect(saved.lang).toBe('th');
    expect(saved.theme).toBe('midnight');
    expect(document.documentElement.lang).toBe('th');

    render(<App initial={saved} />);
    expect(screen.getByLabelText('ราคาสินค้า A')).toHaveProperty('value', '10');
    expect(screen.getByRole('button', { name: 'เพิ่ม' })).toBeTruthy();
  });

  it('has 10 themes, half of them dark', async () => {
    const user = userEvent.setup();
    render(<App initial={defaultState()} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const dialog = screen.getByRole('dialog');
    const radios = within(dialog).getAllByRole('radio');
    expect(radios).toHaveLength(2 + 10); // EN/TH + 10 themes
  });
});
