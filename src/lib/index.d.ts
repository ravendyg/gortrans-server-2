/// <reference path="../../typings/tsd.d.ts" />

declare type Schedule = { [id: string]: ScheduleItem };

declare type ScheduleItem =
{
	nextRun: number
};

declare type State =
{
  [id: string]:
  {
    [graph: string]: busData
  }
};

declare type ListMarsh =
{
  type: string,
  ways: Way []
};

declare type Way =
{
  marsh: string,
  name: string,
  stopb: string,
  stope: string
};

declare type busData =
{
  title: string,
  id_typetr: string,
  marsh: string,
  graph: number,
  direction: string,
  lat: number,
  lng: number,
  time_nav: number,
  azimuth: number,
  rasp: string,
  speed: number,
  segment_order: string,
  ramp: string
};

declare type PromiseSelf =
{
  resolve: any,
  reject: any
};

declare type indexedBusData = {
  [id: string]: busData []
};

declare interface ExpressError extends Error {
  status: number;
  __stack: string [];
}

