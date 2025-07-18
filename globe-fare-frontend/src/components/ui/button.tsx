import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline:
        'border border-gray-600 bg-transparent text-white hover:bg-gray-700',
      secondary: 'bg-gray-700 text-white hover:bg-gray-600',
      ghost: 'hover:bg-gray-700 hover:text-white',
      link: 'text-blue-400 underline-offset-4 hover:underline',
    };

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;

    return <button className={combinedClasses} ref={ref} {...props} />;
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
