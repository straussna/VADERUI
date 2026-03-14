export interface SoluteTransportInput {
  velocity: number;
  dispersionCoefficient: number;
  retardationFactor: number;
  decayConstant: number;
  sourceConcentration: number;
  columnLength: number;
  timeSteps: number;
  totalTime: number;
}

export interface SoluteTransportResult {
  distance: number[];
  concentration: number[];
  time: number;
}
