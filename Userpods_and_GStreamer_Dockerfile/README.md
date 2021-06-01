# coffeebreak

Build:
```
docker build -t coffeebreak .
```

Sender:
```
docker run -it --rm --network='host' coffeebreak /sender.sh
```

Receiver:
```
docker run -it --rm --network='host' -v $(pwd)/output:/output coffeebreak /receiver.sh
```

