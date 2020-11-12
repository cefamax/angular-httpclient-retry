import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { of, Subject, throwError } from "rxjs";
import { delay, flatMap, retry, share, takeUntil } from "rxjs/operators";

@Component({
  selector: "hello",
  template: `
    <h1>Hello!</h1>
    <h2 *ngIf="progress">{{ state }}</h2>
    <h2 *ngIf="!progress">Success: {{ success }}!</h2>
    <h3 *ngIf="!progress">{{ finalState }}</h3>
    <hr />
    <h3>{{ error }}</h3>
  `,
  styles: [
    `
      h1 {
        font-family: Lato;
      }
    `
  ]
})
export class HelloComponent implements OnInit {
  success = false;
  error = "";
  state = "";
  progress = true;
  finalState = "";
  unsubcribe$ = new Subject<void>();

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    console.log("init component");
    this.state = "Call API in progress...";
    let nTime = 0;
    this.httpClient
      //.get("https://api.mocki.io/v1/2fe696bd")
      .get("https://api.mocki.io/v1/2fe696bd/F")
      .pipe(
        takeUntil(this.unsubcribe$),
        delay(2000),
        flatMap((returnData: any) => {
          nTime++;
          this.state =
            "Call API in progress... (" +
            nTime.toString() +
            " call" +
            (nTime > 1 ? "s" : "") +
            ")";
          console.log(nTime.toString(), ":", returnData);

          //** condition to retry  */
          if (!returnData || !returnData.success) {
            return throwError("Error for Retry Observable");
          } else {
            return of(returnData);
          }
        }),
        retry(10)
      )
      .subscribe(
        //** Respose OK */
        resp => {
          console.log("resp: ", resp);
          this.success = resp.success;
          this.progress = false;
          this.finalState =
            "Execution: " + nTime.toString() + " time" + (nTime > 1 ? "s" : "");
        },
        //** Error */
        err => {
          console.error("error: ", err);
          this.progress = false;
          this.finalState =
            "Execution: " +
            (nTime - 1).toString() +
            " time" +
            (nTime - 1 > 1 ? "s" : "");
        },
        //** Observable complete */
        () => {
          this.progress = false;
        }
      );
  }

  ngOnDestroy() {
    this.unsubcribe$.next();
    this.unsubcribe$.complete();
  }
}
