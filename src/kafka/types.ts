import { PatientLabsTopicsListening } from "./patientLabs/index";
const PatientLabsTopicsService = new PatientLabsTopicsListening();
export async function kafkaTopicsListening() {
  PatientLabsTopicsService.labsTopicsListening();
}
