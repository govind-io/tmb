export $entityTypeDef

export type Get$entityNameParams = {
    page?: number;
    size?: number;
}

export type Get$entityNameReaderParams= {
    page: number;
    size: number;
}

export interface PaginatedResponse<T>{
    data: T[];
    total: number;
}