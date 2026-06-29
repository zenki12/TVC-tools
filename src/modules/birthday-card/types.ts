export interface Background {
  id: string;
  name: string;
  gender: 'male' | 'female';
  url: string; // Base64 hoặc Object URL
  isActive: boolean;
  isDefault: boolean;
  uploadedAt: number;
  origin?: 'builtin' | 'shared';
}

export interface TextStyle {
  fontSize: number;    // px trong hệ chuẩn 900x1233
  fontWeight: 'normal' | 'semibold' | 'bold' | 'extrabold';
  color: string;
  align: 'left' | 'center' | 'right';
  x: number;           // Vị trí X (px từ 0 đến 900)
  y: number;           // Vị trí Y (px từ 0 đến 1233)
  lineHeight: number;  // ví dụ 1.2, 1.4, 1.6
}

export interface CustomerInfo {
  fullName: string;
  role: string;
  company: string;
  wishes: string;
}

export interface AvatarCrop {
  x: number;     // offset x (px)
  y: number;     // offset y (px)
  scale: number; // tỉ lệ thu phóng (1, 1.2, etc.)
}

export interface CardState {
  customerType: 'male' | 'female';
  selectedBackgroundId: string;
  customerInfo: CustomerInfo;
  avatarUrl: string | null;
  avatarCrop: AvatarCrop;
  nameStyle: TextStyle;
  roleStyle: TextStyle;
  companyStyle: TextStyle;
  wishesStyle: TextStyle;
}
