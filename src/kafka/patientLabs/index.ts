import { Kafka } from "kafkajs";
import { kafka_server } from "../../admin";
import { createAuditLog } from "../../auditlog";

const kafka = new Kafka({
  clientId: "my-app",
  brokers: [kafka_server],
});
export var patientLabsStore = {};

export class PatientLabsTopicsListening {
  async labsTopicsListening() {
    const consumer = kafka.consumer({
      groupId: `patient_labs_reports-consumer-group`,
    });
    await consumer.connect();
    await consumer.subscribe({
      topic: "patient_labs_reports",
      fromBeginning: true,
    });
    await consumer.run({
      eachMessage: async (data) => {
        const { topic, partition, message } = data;
        const operation = message.key.toString().split("#")[0];
        const key = message.key.toString().split("#")[1];
        if (operation == "create" && message.value) {
          const obj = JSON.parse(message.value.toString("utf8"));
          let data = {
            previousData: patientLabsStore[key],
            newData: obj,
            type: "create",
            event: "patient_labs_reports",
            id: obj.patientId,
          };
          createAuditLog(data);
          obj.patientId ? (patientLabsStore[key] = obj) : null;
          console.log("data sent to local");
        } else if (operation == "update" && message.value) {
          const obj = JSON.parse(message.value.toString("utf8"));
          let data = {
            previousData: patientLabsStore[key],
            newData: obj,
            type: "update",
            event: "patient_labs_reports",
            id: obj.patientId,
          };
          createAuditLog(data);
          let result = patientLabsStore[key];
          patientLabsStore[key] = {
            ...result,
            ...obj,
          };
        } else if (operation == "delete") {
          let data = {
            previousData: patientLabsStore[key],
            newData: {},
            type: "delete",
            event: "patient_labs_reports",
            id: key,
          };
          createAuditLog(data);
          delete patientLabsStore[key];
        }
      },
    });
    consumer.seek({ topic: "patient_labs_reports", partition: 0, offset: "0" });
  }
}
