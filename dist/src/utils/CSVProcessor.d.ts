import { CompanyInput } from '../types/index.js';
export interface CSVProcessingOptions {
    separator?: ',' | ';' | '\t' | '|' | string;
    encoding?: BufferEncoding;
    quote?: string;
    escape?: string;
    skipEmptyLines?: boolean;
    headers?: boolean;
    customHeaders?: string[];
}
export declare const CSV_FORMATS: {
    readonly STANDARD: {
        readonly separator: ",";
        readonly encoding: BufferEncoding;
        readonly quote: "\"";
    };
    readonly EUROPEAN: {
        readonly separator: ";";
        readonly encoding: BufferEncoding;
        readonly quote: "\"";
    };
    readonly EXCEL_EUROPEAN: {
        readonly separator: ";";
        readonly encoding: BufferEncoding;
        readonly quote: "\"";
    };
    readonly TSV: {
        readonly separator: "\t";
        readonly encoding: BufferEncoding;
        readonly quote: "\"";
    };
    readonly PIPE: {
        readonly separator: "|";
        readonly encoding: BufferEncoding;
        readonly quote: "\"";
    };
};
export declare class CSVProcessor {
    readCompaniesWithFormat(filePath: string, format: keyof typeof CSV_FORMATS, additionalOptions?: Partial<CSVProcessingOptions>): Promise<CompanyInput[]>;
    readCompanies(filePath: string, options?: CSVProcessingOptions): Promise<CompanyInput[]>;
    private configureCsvOptions;
    private validateAndNormalizeCompany;
    private normalizeUrl;
}
//# sourceMappingURL=CSVProcessor.d.ts.map