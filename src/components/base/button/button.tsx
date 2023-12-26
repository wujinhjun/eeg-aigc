import useMergeProps from '@/utils/useMergeProps';

import style from './button.module.css';

interface ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  category?: 'red' | 'blue' | 'green' | 'purple' | 'default';
  className?: string;
}

const defaultButtonProps: Partial<ButtonProps> = {
  type: 'button',
  category: 'default'
};

type ButtonPropsChildren = React.PropsWithChildren<ButtonProps>;

export default function Button(props: ButtonPropsChildren) {
  const {
    children,
    onClick,
    type,
    category,
    className,
    disabled = false
  } = useMergeProps<ButtonPropsChildren>(defaultButtonProps, props);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick && onClick(e);
  };

  return (
    <button
      className={`${style['button-container']} ${category} ${className}`}
      onClick={handleClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
