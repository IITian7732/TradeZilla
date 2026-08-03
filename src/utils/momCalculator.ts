export class MomCalculator {
  length: number;

  constructor(length: number) {
    this.length = length;
  }

  calculate(data: number[]) {
    const result: (number | undefined)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < this.length) {
        result.push(undefined);
      } else {
        result.push(data[i] - data[i - this.length]);
      }
    }
    return result;
  }
}
