import { writeFile } from 'fs';

export default function writeLog(err: any){
    writeFile(
        `${__dirname}/logs/uncaught_exception_${Date.now().toLocaleString()}_${err.name}`,
        JSON.stringify(err),
        {encoding: "utf8"}, () => {
            console.log(`LOG SAVED`);
        })
}