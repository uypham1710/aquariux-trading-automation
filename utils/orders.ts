import { expect } from '@playwright/test';

export async function waitForNewOrderNumber(
  readOrderNumbers: () => Promise<string[]>,
  orderNumbersBefore: string[],
  description: string,
): Promise<string> {
  let newOrderNo = '';
  await expect
    .poll(
      async () => {
        const orderNumbersNow = await readOrderNumbers();
        newOrderNo = orderNumbersNow.find((orderNo) => !orderNumbersBefore.includes(orderNo)) ?? '';
        return newOrderNo;
      },
      { message: `Waiting for a new Order No. in ${description}`, timeout: 30_000 },
    )
    .not.toBe('');
  return newOrderNo;
}
