export interface IFlight {
    arrivalTime: Date,
    date: Date,
    departureTime: Date,
    destination: string,
    flightNo: string,
    name: string,
    origin: string,
    price: number,
    connecting?: boolean
}