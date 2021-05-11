import { ApiService } from './api.service';
import { defer, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { catchError, retry, delay } from 'rxjs/operators';
import { operators } from 'rxjs-compat';
import { async } from '@angular/core/testing';


const provide = (mock: any): any => mock;
const mockHttpClient = {} as HttpClient;


const mockValues = [
  {
    'id': 1,
    'name': 'teste1',
    'description': 'teste1',
    'price': '1.00',
    'imageUrl': 'testeURL',
    'quantity': 1
  },
  {
    'id': 2,
    'name': 'teste2',
    'description': 'teste2',
    'price': '2.00',
    'imageUrl': 'testeURL',
    'quantity': 2
  }
]
const mockHeaders = new HttpHeaders({ Link: '<http://localhost:3000/products?_page=1&_limit=5>; rel="first", <http://localhost:3000/products?_page=2&_limit=5>; rel="next", <http://localhost:3000/products?_page=20&_limit=5>; rel="last"' });
const mockResponse = new HttpResponse<any>({ body: mockValues, headers: mockHeaders });

const mockNoLink = new HttpHeaders({ Link: '' });
const mockResponseWithoutHeaders = new HttpResponse<any>({ body: mockValues, headers: mockNoLink });

const mockErrorResponse = new HttpErrorResponse({ error: [{ 'message': 'Http failure response for http://localhost:3000/productss?_page=1&_limit=5: 404 Not Found' }], status: 404, url: 'http://localhost:3000/productss?_page=1&_limit=5' });
const mockEventErrorResponse = new HttpErrorResponse({ error: new ErrorEvent('erro', { message: 'client-side error' }), status: 404, url: 'http://localhost:3000/productss?_page=1&_limit=5' });

const mockHeadersPageTwo = new HttpHeaders({ Link: '<http://localhost:3000/products?_page=1&_limit=5>; rel="first", <http://localhost:3000/products?_page=1&_limit=5>; rel="prev", <http://localhost:3000/products?_page=3&_limit=5>; rel="next", <http://localhost:3000/products?_page=20&_limit=5>; rel="last"' });
const mockResponsePageTwo = new HttpResponse<any>({ body: mockValues, headers: mockHeadersPageTwo });

const operator = jest.requireActual('rxjs/operators');

function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}

function asyncError<T>(errorObject: any) {
  return defer(() => Promise.reject(errorObject));
}

describe('ApiService', () => {

  let apiService: ApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    apiService = new ApiService(provide(mockHttpClient));
  });
  it('Should be Created', () => {
    expect(apiService).toBeTruthy();
  });
  describe('When call sendGetRequest()', () => {

    it('should get first page of products when call sendGetRequest', done => {
      expect.assertions(3);
      mockHttpClient.get = jest.fn().mockImplementationOnce(() => asyncData(mockResponse));

      apiService.sendGetRequest().subscribe(res => {
        expect(res.body).toEqual(mockValues);
        expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:3000/products', {
          params: new HttpParams({ fromString: "_page=1&_limit=5" }),
          observe: "response"
        });
        done();
      });
    });
    it('should call parselink once when sendGetRequest() succeed', done => {
      apiService.parseLinkHeader = jest.fn().mockImplementation(() => { });
      mockHttpClient.get = jest.fn().mockImplementationOnce(() => asyncData(mockResponse));

      apiService.sendGetRequest().subscribe(res => {
        expect(apiService.parseLinkHeader).toBeCalledTimes(1);
        done();
      });
    });
    it('should throw an error msg when sendGetRequest() fail.', done => {
      expect.assertions(2);
      const errorMsg = 'Error Code: 404\nMessage: Http failure response for http://localhost:3000/productss?_page=1&_limit=5: 404 undefined';
      mockHttpClient.get = jest.fn().mockImplementation(() => asyncError(mockErrorResponse));
      apiService.handleError = jest.fn().mockImplementation(() => throwError(errorMsg));

      apiService.sendGetRequest().subscribe(res => { },
        error => {
          expect(apiService.handleError).toBeCalledTimes(1);
          expect(error).toEqual(errorMsg);
          done();
        }
      )
    });
  })
  describe('When call sendGetRequestToUrl(url)', () => {
    it('should get right products and header from the page', done => {
      expect.assertions(3);
      mockHttpClient.get = jest.fn().mockImplementationOnce(() => asyncData(mockResponsePageTwo));

      apiService.sendGetRequestToUrl("http://localhost:3000/products?_page=2&_limit=5").subscribe(res => {
        expect(res.body).toEqual(mockValues);
        expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:3000/products?_page=2&_limit=5', {
          observe: "response"
        });
        done();
      });
    });
    it('should call parselink once when sendGetRequestToUrl() succeed', done => {
      apiService.parseLinkHeader = jest.fn().mockImplementation(() => { });
      mockHttpClient.get = jest.fn().mockImplementationOnce(() => asyncData(mockResponse));

      apiService.sendGetRequestToUrl("http://localhost:3000/products?_page=2&_limit=5").subscribe(res => {
        expect(apiService.parseLinkHeader).toBeCalledTimes(1);
        done();
      });
    });
    it('should throw an error msg when sendGetRequestToUrl() fail.', done => {
      expect.assertions(2);
      const errorMsg = 'Error Code: 404\nMessage: Http failure response for http://localhost:3000/productss?_page=1&_limit=5: 404 undefined';
      mockHttpClient.get = jest.fn().mockImplementation(() => asyncError(mockErrorResponse));
      apiService.handleError = jest.fn().mockImplementation(() => throwError(errorMsg));

      apiService.sendGetRequestToUrl("http://localhost:3000/productss?_page=2&_limit=5").subscribe(res => { },
        error => {
          expect(apiService.handleError).toBeCalledTimes(1);
          expect(error).toEqual(errorMsg);
          done();
        }
      )
    });
  });
  describe('When call handleError(HttpErrorResponse)', () => {
    window.alert = jest.fn().mockReturnValue('');
    it('Should return a error msg from ErrorEvent', done => {
      expect.assertions(2);
      const errorMsg = 'Error: client-side error';

      apiService.handleError(mockEventErrorResponse).subscribe(res => { },
        error => {
          expect(window.alert).toBeCalledTimes(1);
          expect(error).toEqual(errorMsg);
          done();
        }
      )
    });
    it('Should return a error msg from error mensage', done => {
      expect.assertions(2);
      const errorMsg = 'Error Code: 404\nMessage: Http failure response for http://localhost:3000/productss?_page=1&_limit=5: 404 undefined';
      apiService.handleError(mockErrorResponse).subscribe(res => { },
        error => {
          expect(window.alert).toBeCalledTimes(1);
          expect(error).toEqual(errorMsg);
          done();
        }
      )
    });
  });
  describe('When call parseLinkHeader(header)', () => {
    it('Should return all parses with right result', () => {
      expect.assertions(4);
      apiService.parseLinkHeader(mockHeaders.get('Link'));
      expect(apiService.first).toEqual("http://localhost:3000/products?_page=1&_limit=5");
      expect(apiService.prev).toBeUndefined();
      expect(apiService.next).toEqual("http://localhost:3000/products?_page=2&_limit=5");
      expect(apiService.last).toEqual("http://localhost:3000/products?_page=20&_limit=5");
    });
    it('Should return void when header.link = 0', () => {
      apiService.parseLinkHeader(mockResponseWithoutHeaders.headers.get('Link'));
      expect(apiService.first).toEqual('');
    });
  });
  describe('Operators Tests', () => {
    it('Testing Operators when sendGetRequest succeced', done => {
     const operators = jest.requireActual('rxjs/operators');
     operators.retry = jest.fn(() => (s) => s);
     operators.catchError = jest.fn(() => (s) => s);
     operators.tap = jest.fn(() => (s) => s);
  
     const response = asyncData(mockResponse);
     response.pipe = jest.fn().mockImplementation(() => asyncData(mockResponse));
     mockHttpClient.get = jest.fn().mockImplementation(() => response);
     apiService.handleError = jest.fn();
     apiService.parseLinkHeader = jest.fn();
 
     apiService.sendGetRequest().subscribe(res => {
       expect(response.pipe).toHaveBeenCalledTimes(1);
       expect(response.pipe).toHaveBeenCalledWith(expect.any(Function),expect.any(Function),expect.any(Function));
       expect(operators.catchError).toHaveBeenCalledTimes(1);
       expect(operators.catchError).toHaveBeenCalledWith(apiService.handleError);
       expect(operators.retry).toHaveBeenCalledTimes(1);
       expect(operators.retry).toHaveBeenCalledWith(3);
       expect(operators.tap).toHaveBeenCalledTimes(1);
       expect(operators.tap).toHaveBeenCalledWith(expect.any(Function));
       done();
     });
   });
 
   it('Testing Operators when sendGetRequest failed', done => {
     const operators = jest.requireActual('rxjs/operators');
     operators.retry = jest.fn();
     operators.catch = jest.fn();
     operators.tap = jest.fn();
     
     const responseError = asyncError(mockErrorResponse);
     responseError.pipe = jest.fn().mockImplementation(() => asyncError(mockErrorResponse));
     mockHttpClient.get = jest.fn().mockImplementation(() => responseError);
 
     apiService.sendGetRequest().subscribe(
       res => {
         expect(responseError.pipe).toHaveBeenCalledTimes(1);
         expect(operators.catch).toHaveBeenCalledTimes(1);
         expect(operators.retry).toHaveBeenCalledWith(3);
         done();
       },
       error => {
         done();
       });
   });
 });

});


