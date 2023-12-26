import React, { ForwardedRef, forwardRef, useEffect, useRef } from 'react';
import clsx from 'clsx';

interface IProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;

  placeholder?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;

  autoFocus?: boolean;
  controlFocus?: boolean;

  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function AutoHeightTextareaComponent(
  {
    value,
    placeholder,
    className,
    minHeight,
    maxHeight,
    autoFocus,
    controlFocus,
    onChange,
    onKeyDown,
    onKeyUp
  }: IProps,
  ref: ForwardedRef<HTMLTextAreaElement>
) {
  const innerRef =
    (ref as React.MutableRefObject<HTMLTextAreaElement>) ||
    useRef<HTMLTextAreaElement | null>(null);

  const handleFocus = () => {
    const element = innerRef.current;

    if (!element) {
      return false;
    }

    element.setSelectionRange(value.length, value.length);
    element.focus();
    return true;
  };

  const focus = () => {
    if (!handleFocus()) {
      let isFocus = false;
      const runId = setInterval(() => {
        isFocus = handleFocus();
        if (isFocus) {
          clearInterval(runId);
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (autoFocus) {
      focus();
    }
  }, []);

  useEffect(() => {
    if (controlFocus) {
      focus();
    }
  }, [controlFocus]);

  return (
    <div className="relative w-[60%]">
      <pre
        className={clsx(
          className,
          'invisible whitespace-pre-wrap break-all overflow-y-auto'
        )}
        style={{
          minHeight,
          maxHeight
        }}
      >
        {!value ? placeholder : value}
      </pre>
      <textarea
        name=""
        ref={ref}
        className={clsx(
          className,
          'absolute inset-0 resize-none overflow-auto'
        )}
        style={{
          minHeight,
          maxHeight
        }}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      ></textarea>
    </div>
  );
}

export default React.forwardRef(AutoHeightTextareaComponent);
