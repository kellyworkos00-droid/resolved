declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';

  export const ArrowUpCircle: FC<SVGProps<SVGSVGElement>>;
  export const ArrowDownCircle: FC<SVGProps<SVGSVGElement>>;
  export const Package: FC<SVGProps<SVGSVGElement>>;
  export const Filter: FC<SVGProps<SVGSVGElement>>;
  export const Download: FC<SVGProps<SVGSVGElement>>;
  
  // Export all other icons as well
  export const [key: string]: FC<SVGProps<SVGSVGElement>>;
}
