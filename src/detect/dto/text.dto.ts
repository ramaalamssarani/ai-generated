import { IsNumber, IsOptional, IsString } from "class-validator";

export class Text {

    @IsString()
    text: string = '';
}