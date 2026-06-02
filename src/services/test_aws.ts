import { awsCreateMailingList, awsGetMailingLists } from "./aws";

async function main() {
  console.log("Running AWS SES Simulation test...");
  try {
    const listBefore = await awsGetMailingLists();
    console.log("Mailing lists before:", listBefore);

    const newList = await awsCreateMailingList("TestMailingList", "A testing list");
    console.log("Created list:", newList);

    const listAfter = await awsGetMailingLists();
    console.log("Mailing lists after:", listAfter);
  } catch (error) {
    console.error("Test encountered an error:", error);
  }
}

main();
