# Скрипты деплоя на сервер

Управление продакшен-сервером `200.165.231.132` через SSH (Python + paramiko).

Требуется: `python -m pip install paramiko`, ключ `~/.ssh/id_ed25519_vahta`
(вход по паролю — через переменную окружения `SSH_PASS`).

## Выполнить команду на сервере

```bash
python ssh_exec.py 200.165.231.132 root "docker ps"
```

Сложные команды с кавычками можно закодировать в base64, чтобы обойти
баг передачи кавычек из Windows PowerShell в нативный процесс:

```powershell
$inner = 'docker compose exec -T db psql -U vahta -d vahta -c "SELECT 1"'
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($inner))
python ssh_exec.py 200.165.231.132 root "echo $b64 | base64 -d | bash"
```

## Развернуть папку на сервере (SFTP)

```bash
python deploy_site.py 200.165.231.132 root ./site /srv/vahta
```

Сначала очищает содержимое удалённой папки, затем загружает файлы
рекурсивно (создавая подпапки). Данные БД в volume `vahta_pgdata`
не затрагиваются.

## Обновление продакшена

```bash
# 1. Загрузить актуальные файлы проекта (git archive + deploy_site.py)
# 2. Пересобрать и переключить контейнеры без простоя:
ssh vahta "cd /srv/vahta && docker compose build && docker compose up -d"
```
