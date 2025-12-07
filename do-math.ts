import { connect, StringCodec } from "nats";

const sc = StringCodec();
const jobSubName="your-jobs"
const jobQueueName="your-queue"

function divide(a: number, b: number) {
  return a / b;
}

function sum(a: number, b: number) {
  return a + b;
}

function handleJob(job: string) {
  switch (job) {
    case "devide 12 with 2":
      return divide(12, 2);
    case "sum 90+1":
      return sum(90, 1);
    default:
      throw new Error(`unknown job: ${job}`);
  }
}

async function startWorker() {
  const nc = await connect({ servers: "localhost:4222" });
  const sub = nc.subscribe(jobSubName, { queue: jobQueueName });

  console.log("Worker started:", process.pid);
  (async () => {
    for await (const m of sub) {
      const job = sc.decode(m.data);
      console.log(`[${process.pid}] processing: ${job}`);
      try {
        const result = handleJob(job);
        console.log(`[${process.pid}] result: ${result}`);
      } catch (err) {
        console.error(`[${process.pid}] error handling job: ${job}`, err);
      }
    }
  })();

  return nc;
}

async function publishJobs(nc:any) {
  const jobs = ["devide 12 with 2", "sum 90+1"];
  for (const job of jobs) {
    nc.publish(jobSubName, sc.encode(job));
    console.log("Sent job:", job);
  }
  await nc.flush();
}

async function main() {
  const workerConn = await startWorker();
  await publishJobs(workerConn);

  // Let the worker finish then close
  setTimeout(async () => {
    await workerConn.drain();
    console.log("Closed connection");
  }, 2000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});