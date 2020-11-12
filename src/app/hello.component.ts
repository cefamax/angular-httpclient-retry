import { HttpClient } from "@angular/common/http";
import { Component, Input, OnInit } from "@angular/core";
import { Observable, of, Subject, throwError } from "rxjs";
import { delay, flatMap, map, retry, share, takeUntil } from "rxjs/operators";

@Component({
  selector: "hello",
  template: `
    <h1>Hello {{ name }}!</h1>
    <h2>result: {{ success }}!</h2>
    <h3> {{ error }}</h3>

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
  @Input() name: string;
  success = false;
  error = "";
  unsubcribe$ = new Subject<void>();

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    console.log("init component");
    
    let nTime = 0;
    this.httpClient
      //.get("https://api.mocki.io/v1/2fe696bd")
      .get("https://api.mocki.io/v1/2fe696bd/F")
      .pipe(
        takeUntil(this.unsubcribe$),
        delay(2000),
        flatMap((data: any) => {
          nTime++;
          console.log(nTime.toString(), ":", data);

          if (!data || !data.success) {
              return throwError("Error for Retry Observable");
          } else {
            return of(data);
          }
        }),
        retry(10),
        share()
      )
      .subscribe(resp => {
        console.log("resp: ",resp);
        if (resp?.success) {
          this.success = resp.success;
        } else {
          this.error = 'This is an Error';
          console.error("Error get data");
        }
      }, err=>{console.error('error: ',err)});
  }

  ngOnDestroy(){
    this.unsubcribe$.next();
    this.unsubcribe$.complete();
  }
}
