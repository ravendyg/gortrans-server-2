/// <reference path="../../typings/tsd.d.ts" />

declare type Schedule = { [id: string]: ScheduleItem };

declare type ScheduleItem =
{
	nextRun: number
};

declare type State =
{
  [busCode: string]:
  {
    [graph: string]: busData
  }
};

declare type StateChanges =
{
  [busCode: string]:
  {
    update:
    {
      [graph: string]: busData
    }, // new data for existing buses
    add:
    {
      [graph: string]: busData
    }, // data for new buses
    remove: string []   // graph numbers to be removed
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

declare type indexedBusData =
{
  [busCode: string]: busData []
};

declare interface ExpressError extends Error
{
  status: number;
  __stack: string [];
}

declare type Subscribers =
{
  [id: string]: (changes: StateChanges) => void
};

declare type SocketClient =
{
  socket: SocketIO.Socket;
  buses:
  {
    [id: string]: boolean
  }
};


declare type BusPoint =
{
  lat: string,
  lng: string,
  id?: string,
  n?: string,
  len?: string,
};

declare type TrassResponse =
{
  trasses:
  {
    r:
    {
      pc: string,
      marsh: string,
      u: BusPoint []
    } []
  } []
};

