export interface PaymentRequest
{
    CartId : number,
    PaymentMethod : string
    Receiver : string,
    Phone : string,
    Address : string,
    TotalPrice :number
}