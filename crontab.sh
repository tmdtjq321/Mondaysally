#!/bib/bash

echo 'auto-work off Request!';

curl -H "Content-Type: application/json" -X GET http://localhost:3000/auto-workoff

echo 'auto-work off SUCCESS';

