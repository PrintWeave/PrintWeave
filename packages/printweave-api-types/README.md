# @printweave/api-types

## Typescript Types
Here is a quick example of how to use the types in Typescript.
```typescript
import { GetPrintersResponse, GetPrintersError } from '@printweave/api-types'

const token = '<token>';
fetch('http://localhost:3000/api/printer', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token  // token is the JWT token
    }
}).then(response => response.json())
    .then((data: GetPrintersResponse | GetPrintersError) => {
        if ((data as GetPrintersError).code) {
            // Check if the error is an UnauthorizedError, this is optional since the error is already typed
            if (isUnauthorizedError(data)) {
                console.log('Unauthorized');
                return;
            }

            console.log('Error:', (data as GetPrintersError).message);
        } else {
            console.log('Data:', (data as GetPrintersResponse));
        }
    });
```
