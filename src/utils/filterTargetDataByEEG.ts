export default function filterTargetDataByEEG(
  result: Record<string, Array<number | null>>
) {
  let currentStatus = '',
    currentValue = 0;

  const dict: Record<string, string> = {
    attention: '专注的',
    eng: '集中的',
    exc: '兴奋的',
    str: '有压力的',
    rel: '放松的',
    int: '有兴趣的',
    '': ''
  };
  for (const [k, v] of Object.entries(result)) {
    if (v[0] && v[0] > currentValue) {
      currentStatus = k;
      currentValue = v[0];
    }
  }

  return { status: dict[currentStatus], value: currentValue };
}
