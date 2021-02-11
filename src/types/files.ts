// apparently File type does not include lastModifiedDate, even though it is present
export interface MyFile extends File {
  lastModifiedDate: any
}
