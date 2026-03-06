declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';

  export interface IconProps extends SVGProps<SVGSVGElement> {}
  
  export const ArrowUpCircle: FC<IconProps>;
  export const ArrowDownCircle: FC<IconProps>;
  export const Package: FC<IconProps>;
  export const Filter: FC<IconProps>;
  export const Download: FC<IconProps>;
}
