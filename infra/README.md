# Infra Local Setup

If TigerBeetle fails with:

`thread <n> panic: Path does not exist`

it means the replica data files were not formatted yet.

## First-time setup

Run one-time initialization:

```bash
docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK -v $(pwd)/data:/data ghcr.io/tigerbeetle/tigerbeetle format --cluster=0 --replica=0 --replica-count=3 /data/0_0.tigerbeetle
docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK -v $(pwd)/data:/data ghcr.io/tigerbeetle/tigerbeetle format --cluster=0 --replica=1 --replica-count=3 /data/0_1.tigerbeetle
docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK -v $(pwd)/data:/data ghcr.io/tigerbeetle/tigerbeetle format --cluster=0 --replica=2 --replica-count=3 /data/0_2.tigerbeetle
```

Then start the cluster:

```bash
docker compose up -d tigerbeetle_0 tigerbeetle_1 tigerbeetle_2
```

Or from `tigui-desktop/`, use the helper command:

```bash
pnpm infra:tigerbeetle:start
```

## Reset local data (optional)

If you want a clean local TigerBeetle state, remove files under `infra/data/` and run the init step again.
