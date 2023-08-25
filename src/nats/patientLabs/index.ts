import { NatsConnection, StringCodec, Subscription } from "nats";
import { patientLabsStore } from "../../kafka/patientLabs";

export class PatientLabsRulesNats {
  async patientLabsNatsSubscriber(nc: NatsConnection) {
    const sc = StringCodec();
    const sub = nc.subscribe("patient_labs_reports");
    (async (sub: Subscription) => {
      console.log(`listening for ${sub.getSubject()} requests...`);
      for await (const m of sub) {
        const decoder = new TextDecoder("utf-8");
        const payload = JSON.parse(decoder.decode(m.data));
        if (payload.type == "get") {
          const finalres = patientLabsStore[payload.patientId];
          if (finalres) {
            if (m.respond(sc.encode(JSON.stringify(finalres)))) {
              console.info(`[labs] handled #${sub.getProcessed()}`);
            } else {
              console.log(
                `[labs] #${sub.getProcessed()} ignored - no reply subject`
              );
            }
          } else {
            console.log("not found");
            if (m.respond(sc.encode("404"))) {
              console.info(`[labs] handled #${sub.getProcessed()}`);
            } else {
              console.log(
                `[labs] #${sub.getProcessed()} ignored - no reply subject`
              );
            }
          }
        } else if (payload.type == "getAll") {
          const allPatientLabs: any = patientLabsStore;
          const finalRes = Object.values(allPatientLabs);
          m.respond(sc.encode(JSON.stringify(finalRes)));
        }
      }

      console.log(`subscription ${sub.getSubject()} drained.`);
    })(sub);
  }
}
