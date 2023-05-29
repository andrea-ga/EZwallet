import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';

describe("handleDateFilterParams", () => {
    test('from filter', () => {
        const mockReq = {url : "localhost:3000/api/users/test/transactions?from=2023-04-30",
                        query: {from: "2023-04-30"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: "2023-04-30T00:00:00.000Z"}});
    });

    test('upTo filter', () => {
        const mockReq = {url : "localhost:3000/api/users/test/transactions?upTo=2023-05-10",
            query: {upTo: "2023-05-10"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$lte: "2023-05-10T23:59:59.000Z"}});
    });

    test('date filter', () => {
        const mockReq = {url : "localhost:3000/api/users/test/transactions?date=2023-05-10",
            query: {date: "2023-05-10"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: "2023-05-10T00:00:00.000Z",
                $lte: "2023-05-10T23:59:59.000Z"}});
    });

    test('from and upTo filters', () => {
        const mockReq = {
            url : "localhost:3000/api/users/test/transactions?from=2023-04-30&upTo=2023-05-10",
            query: {from: "2023-04-30", upTo: "2023-05-10"}};

        expect(handleDateFilterParams(mockReq)).toStrictEqual({date: {$gte: "2023-04-30T00:00:00.000Z",
                $lte: "2023-05-10T23:59:59.000Z"}});
    });

    test('date and upTo filters', () => {
        try {
            const mockReq = {
                url : "localhost:3000/api/users/test/transactions?date=2023-04-30&upTo=2023-05-10",
                query: {date: "2023-04-30", upTo: "2023-05-10"}};

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong query format");
        }
    });

    test('date and from filters', () => {
        try {
            const mockReq = {
                url : "localhost:3000/api/users/test/transactions?from=2023-04-30&date=2023-05-10",
                query: {from: "2023-04-30", date: "2023-05-10"}};

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong query format");
        }
    });

    test('wrong date - from filter', () => {
        try {
            const mockReq = {
                url: "localhost:3000/api/users/test/transactions?from=2023-04-",
                query: {from: "2023-04-"}
            };

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong date format");
        }
    });

    test('wrong date - upTo filter', () => {
        try {
            const mockReq = {
                url: "localhost:3000/api/users/test/transactions?upTo=2023-05-",
                query: {upTo: "2023-05-"}
            };

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong date format");
        }
    });

    test('wrong date - date filter', () => {
        try {
            const mockReq = {
                url: "localhost:3000/api/users/test/transactions?date=2023-05-",
                query: {date: "2023-05-"}
            };

            handleDateFilterParams(mockReq);
        } catch(error) {
            expect(error.message).toBe("wrong date format");
        }
    });
})

describe("verifyAuth", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("handleAmountFilterParams", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
