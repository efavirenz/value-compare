"""Generates the app icons (balance scale on deep green). Requires Pillow: pip install pillow"""
from PIL import Image, ImageDraw

BG, WHITE, GOLD = (17, 94, 63), (255, 255, 255), (255, 209, 102)
S = 4  # supersampling


def draw_scale(d, size):
    k = size * S / 512
    def p(x, y): return (x * k, y * k)
    def line(a, b, w, c=WHITE): d.line([p(*a), p(*b)], fill=c, width=int(w * k))
    left, right = (126, 200), (386, 152)          # beam ends (left side heavier)
    line((256, 140), (256, 380), 18)               # pole
    d.rounded_rectangle([p(186, 372), p(326, 398)], radius=12 * k, fill=WHITE)  # base
    line(left, right, 16)                          # beam
    d.ellipse([p(240, 124), p(272, 156)], fill=WHITE)  # pivot
    for end, cx, cy in ((left, 126, 300), (right, 386, 252)):
        line(end, (cx - 60, cy), 6)
        line(end, (cx + 60, cy), 6)
        d.pieslice([p(cx - 60, cy - 60), p(cx + 60, cy + 60)], 0, 180, fill=GOLD)


def make(size, rounded):
    img = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, size * S - 1, size * S - 1], radius=size * S * 0.22, fill=BG)
    else:
        d.rectangle([0, 0, size * S, size * S], fill=BG)
    draw_scale(d, size)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    make(192, True).save('public/icon-192.png')
    make(512, True).save('public/icon-512.png')
    make(512, False).save('public/icon-maskable-512.png')   # full bleed, content inside safe zone
    make(180, False).convert('RGB').save('public/apple-touch-icon.png')
    print('icons written')
