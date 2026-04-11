import { IsNumber, IsOptional, IsString } from "class-validator";

export class Image {

    @IsString()
    @IsOptional()
    image ?: string;
}
