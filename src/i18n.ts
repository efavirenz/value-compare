export type Lang = 'en' | 'th';

export interface Strings {
  menu: string;
  settings: string;
  close: string;
  language: string;
  theme: string;
  lightThemes: string;
  darkThemes: string;
  price: string;
  unitLabel: string;
  add: string;
  clear: string;
  result: string;
  rank: string;
  item: string;
  unitPrice: string;
  vsBest: string;
  perUnit: (unit: string) => string;
  itemDeleted: (label: string) => string;
  cleared: string;
  undo: string;
  offlineReady: string;
  latest: string;
  updating: string;
  updateAvailable: string;
  checkFailed: string;
  removeItem: (label: string) => string;
  priceOf: (label: string) => string;
  qtyOf: (label: string, unit: string) => string;
  versionAria: (version: string) => string;
  versionAriaUpdate: (version: string) => string;
  storageFailed: string;
  errorBoundaryTitle: string;
  errorBoundaryReset: string;
  maxItems: string;
}

export const strings: Record<Lang, Strings> = {
  en: {
    menu: 'Menu',
    settings: 'Settings',
    close: 'Close',
    language: 'Language',
    theme: 'Theme',
    lightThemes: 'Light',
    darkThemes: 'Dark',
    price: 'Price',
    unitLabel: 'Unit',
    add: 'Add',
    clear: 'Clear',
    result: 'Result',
    rank: 'Rank',
    item: 'Item',
    unitPrice: 'Unit Price',
    vsBest: 'vs Best',
    perUnit: (unit) => `THB / ${unit}`,
    itemDeleted: (label) => `Item ${label} deleted`,
    cleared: 'All items cleared',
    undo: 'Undo',
    offlineReady: 'Ready to use offline',
    latest: 'You are on the latest version',
    updating: 'Updating…',
    updateAvailable: 'Update available. Tap the version number to update.',
    checkFailed: 'Could not check for updates. Check your connection.',
    removeItem: (label) => `Delete item ${label}`,
    priceOf: (label) => `Price of item ${label}`,
    qtyOf: (label, unit) => `Amount in ${unit} of item ${label}`,
    versionAria: (version) => `Version ${version}. Tap to check for updates`,
    versionAriaUpdate: (version) => `Version ${version}. Update available, tap to activate`,
    storageFailed: 'Could not save data. Changes are kept in memory only.',
    errorBoundaryTitle: 'Something went wrong',
    errorBoundaryReset: 'Reset App',
    maxItems: 'Maximum 10 items',
  },
  th: {
    menu: 'เมนู',
    settings: 'ตั้งค่า',
    close: 'ปิด',
    language: 'ภาษา',
    theme: 'ธีมสี',
    lightThemes: 'สว่าง',
    darkThemes: 'มืด',
    price: 'ราคา',
    unitLabel: 'หน่วย',
    add: 'เพิ่ม',
    clear: 'ล้าง',
    result: 'ผลลัพธ์',
    rank: 'อันดับ',
    item: 'สินค้า',
    unitPrice: 'ราคาต่อหน่วย',
    vsBest: 'เทียบอันดับ 1',
    perUnit: (unit) => `บาท / ${unit}`,
    itemDeleted: (label) => `ลบสินค้า ${label} แล้ว`,
    cleared: 'ล้างข้อมูลทั้งหมดแล้ว',
    undo: 'เลิกทำ',
    offlineReady: 'พร้อมใช้งานออฟไลน์แล้ว',
    latest: 'เป็นเวอร์ชันล่าสุดแล้ว',
    updating: 'กำลังอัปเดต…',
    updateAvailable: 'มีเวอร์ชันใหม่ กดที่เลขเวอร์ชันเพื่ออัปเดต',
    checkFailed: 'ตรวจสอบการอัปเดตไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อ',
    removeItem: (label) => `ลบสินค้า ${label}`,
    priceOf: (label) => `ราคาสินค้า ${label}`,
    qtyOf: (label, unit) => `ปริมาณ (${unit}) ของสินค้า ${label}`,
    versionAria: (version) => `เวอร์ชัน ${version} กดเพื่อตรวจสอบการอัปเดต`,
    versionAriaUpdate: (version) => `เวอร์ชัน ${version} มีอัปเดตใหม่ กดเพื่อเริ่มใช้งาน`,
    storageFailed: 'ไม่สามารถบันทึกข้อมูลได้ ข้อมูลจะเก็บอยู่ในความจำชั่วคราวเท่านั้น',
    errorBoundaryTitle: 'เกิดข้อผิดพลาดบางอย่าง',
    errorBoundaryReset: 'รีเซ็ตแอป',
    maxItems: 'สูงสุด 10 สินค้า',
  },
};
