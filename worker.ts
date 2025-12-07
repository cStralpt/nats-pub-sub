import { connect, StringCodec } from "nats";

const sc = StringCodec();

async function main() {
  const nc = await connect({ servers: "localhost:4222" });

  const sub = nc.subscribe("jobs", { queue: "workers" });

  console.log("Worker started:", process.pid);

  for await (const m of sub) {
    const job = sc.decode(m.data);
    console.log(`[${process.pid}] processing job:`, job);

    // Simulate async job
    await new Promise(r => setTimeout(r, 2000));

    console.log(`[${process.pid}] done job:`, job);
  }
}

main();
