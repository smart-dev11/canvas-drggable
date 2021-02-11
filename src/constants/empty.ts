/*
  The empty objects in this file are to be used for state logic
  that would otherwise trigger a re-render if passed an empty data container
  as a default argument

  doing something like const [x, setX] = useState([])
  will always trigger a state change because the empty array
  is considered a different array in memory on reach render

  Using EMPTY_ARR below mitigates this problem by always referencing the same array
  This same logic applies to every other empty container
*/
export const EMPTY_OBJ: { [key: string]: any } = {}
export const EMPTY_ARR: any[] = []
