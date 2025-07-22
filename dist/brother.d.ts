export interface PrintOptions {
    /** default: true */
    autoCut?: boolean;
    /** default: 128 */
    blackwhiteThreshold?: number;
    /** default: true */
    halfCut?: boolean;
    /** default: false */
    highResolution?: boolean;
    /** default: 12  */
    tapeWidth?: 12 | 18 | 24;
}
export declare const printPngFile: (printerUrl: string, filename: string, options?: PrintOptions) => Promise<any>;
export declare const printBuffer: (printerUrl: string, buffer: Buffer, options?: PrintOptions) => Promise<any>;
