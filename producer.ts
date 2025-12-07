import { connect, StringCodec } from "nats";

const sc = StringCodec();

async function main() {
  const nc = await connect({ servers: "localhost:4222" });

  for (let i = 1; i <= 10; i++) {
    nc.publish("jobs", sc.encode(`job #${i}`));
    console.log("Sent job", i);
  }

  await nc.flush();
}

main();
