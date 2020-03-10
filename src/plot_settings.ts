class PlotSettings{
  plotInterval:number;
  backgroundColor:string;
  lineWidth:number;
  scaleLabelVisible:boolean;
  twoDimensional:boolean;
  autoRotate:boolean;
  animate:boolean;
  seek:number;
  constructor(obj: any) {
    this.plotInterval = obj?.plotInterval ?? 0.1;
    this.backgroundColor = obj?.backgroundColor ?? "#000000";
    this.lineWidth = obj?.lineWidth ?? 1;
    this.scaleLabelVisible = obj?.scaleLabelVisible ?? true;
    this.twoDimensional = obj?.twoDimensional ?? false;
    this.autoRotate = obj?.autoRotate ?? false;
    this.animate = obj?.animate ?? false;
    this.seek = obj?.seek ?? 0;
  }
  static parseJSON(json: string) {
    return new PlotSettings(JSON.parse(json));
  }
}
