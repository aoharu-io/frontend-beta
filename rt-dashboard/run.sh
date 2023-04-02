cd ..

cd ../beacon && python main.py -H 127.0.0.1 -p 8765 &

cd ../api && uvicorn main:app &

cd ../bot && python main.py &

open http://127.0.0.1:8000/docs &
