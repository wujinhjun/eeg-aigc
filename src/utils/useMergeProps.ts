import { useMemo } from 'react';

export default function useMergeProps<PropsType>(
  defaultProps: Partial<PropsType>,
  componentProps: PropsType
): PropsType {
  const _defaultProps = useMemo(() => {
    return {
      ...defaultProps
    };
  }, [defaultProps]);

  const props = useMemo(() => {
    return Object.assign(_defaultProps, componentProps);
  }, [_defaultProps, componentProps]);

  return props;
}
