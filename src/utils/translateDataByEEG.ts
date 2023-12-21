export default function translateDataByEEG(
  data: Array<number | null | boolean>
): Record<string, Array<number | null>> {
  const resultTemp: Array<Array<null | number>> = [];
  let currentGroup: Array<null | number> = [];
  const dict: Record<string, string> = {
    0: 'attention',
    1: 'eng',
    2: 'exc',
    3: 'str',
    4: 'rel',
    5: 'int'
  };

  data &&
    data.forEach((item) => {
      if (typeof item === 'boolean') {
        currentGroup.length > 0 && resultTemp.push(currentGroup);
        currentGroup = [];
      } else {
        currentGroup.push(item);
      }
    });

  data && resultTemp.push(currentGroup);

  const result: Record<string, Array<null | number>> = resultTemp.reduce(
    (prev, current, index) => {
      prev[dict[index]] = current;
      return prev;
    },
    {} as Record<string, Array<null | number>>
  );

  return result;
}
