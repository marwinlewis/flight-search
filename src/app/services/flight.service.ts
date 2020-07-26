import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IFlight } from '../models/IFlight';
import { IBookingInformation } from '../models/IBookingInformation';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import { nextTick } from 'process';

@Injectable({
  providedIn: 'root'
})
export class FlightService {

    private _url: string = "./assets/data/data.json";

    private _resultSource = new Subject<IFlight[][]>();
    result$ = this._resultSource.asObservable();
    

    private _flightData: {
      oneWay: IFlight[],
      returnWay: IFlight[]
    }

    constructor(private http: HttpClient) {
      this._flightData = {
        oneWay: [],
        returnWay: []
      }
    }

    private _getApi(): Observable<IFlight[]>{
      return this.http.get<IFlight[]>(this._url);
    }

    private _resetFlightData(){
      this._flightData.oneWay = [];
      this._flightData.returnWay = [];
    }

    public getCities(){
      return this._getApi().pipe(map(data => {
        const cities: String[] = [];
        data.map(data => {
          cities.push(data.origin);
          cities.push(data.destination);
        });
        return [...new Set(cities)];
      }));
    }

    public flightSearch(bookingInformation: IBookingInformation){
      this._resetFlightData();

      return this._getApi().pipe(map(apiData => {
        apiData.map(apiFlightData => {
          apiFlightData.price = Number(apiFlightData.price) * (bookingInformation.passengers <=0 ? 1 : bookingInformation.passengers);

          this._updateDirectFlightData(bookingInformation, apiFlightData);
        })
        this._updateConnectingFlights(bookingInformation, apiData);
        return [[...this._flightData.oneWay],[...this._flightData.returnWay]];
      }));
    }

    private _updateDirectFlightData(bookingInformation: IBookingInformation, apiFlightData: IFlight){
      bookingInformation.departureDate = new Date(bookingInformation.departureDate);
      bookingInformation.returnDate = new Date(bookingInformation.returnDate);
      let dataDepartureDate = new Date(apiFlightData.date);

      if(bookingInformation.departureDate.getTime() == dataDepartureDate.getTime() && bookingInformation.origin==apiFlightData.origin && bookingInformation.destination==apiFlightData.destination){
        this._flightData.oneWay.push(apiFlightData);
      }

      if(bookingInformation.return==true && new Date(bookingInformation.returnDate).getTime() > new Date(bookingInformation.departureDate).getTime()){
        if(dataDepartureDate.getTime() == bookingInformation.returnDate.getTime() && bookingInformation.origin==apiFlightData.destination && bookingInformation.destination==apiFlightData.origin){
          this._flightData.returnWay.push(apiFlightData);
        }
      }
    }

    private _updateConnectingFlights(bookingInformation: IBookingInformation, apiData: IFlight[]){
      let tempArr: IFlight[] = [];
      apiData.map(apiFlightData => {

        let secondFlightFound = false;

        apiFlightData.price = Number(apiFlightData.price) * (bookingInformation.passengers <=0 ? 1 : bookingInformation.passengers);

        bookingInformation.departureDate = new Date(bookingInformation.departureDate);
        bookingInformation.returnDate = new Date(bookingInformation.returnDate);
        let dataDepartureDate = new Date(apiFlightData.date);

        if(bookingInformation.departureDate.getTime() == dataDepartureDate.getTime() && bookingInformation.origin==apiFlightData.origin || bookingInformation.destination==apiFlightData.destination){
          if(!(bookingInformation.origin==apiFlightData.origin && bookingInformation.destination==apiFlightData.destination)){
            if(bookingInformation.origin==apiFlightData.origin){
              apiData.map(newApiFlightData=>{
                if(apiFlightData.destination==newApiFlightData.origin && newApiFlightData.destination==bookingInformation.destination && new Date(apiFlightData.date + " " + apiFlightData.arrivalTime) < new Date(newApiFlightData.date + " " + newApiFlightData.departureTime) && secondFlightFound==false){
                  let addition: IFlight = {
                    arrivalTime: new Date(),
                    date: new Date(),
                    departureTime: new Date(),
                    destination: '',
                    flightNo: '',
                    name: '',
                    origin: '',
                    price: 0,
                  };
                  addition.arrivalTime = newApiFlightData.arrivalTime;
                  addition.date = apiFlightData.date;
                  addition.departureTime = apiFlightData.departureTime;
                  addition.destination = newApiFlightData.destination;
                  addition.flightNo = apiFlightData.flightNo + " -> " + newApiFlightData.flightNo;
                  addition.name = apiFlightData.name + " -> " + newApiFlightData.name;
                  addition.origin = apiFlightData.origin;
                  addition.price = apiFlightData.price + newApiFlightData.price;
                  addition.connecting = true;
                  this._flightData.oneWay.push(addition); //addition
                  this._flightData.oneWay.push(apiFlightData); //first flight
                  this._flightData.oneWay.push(newApiFlightData); //second flight
                  secondFlightFound=true;
                }
              })
            }
          }
        }
      });
    }

    sendResult(result: IFlight[][], bookingInformation: IBookingInformation){
      this._resultSource.next(result);
    }
}
