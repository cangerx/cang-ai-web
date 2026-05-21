#!/bin/bash
# 前端本地构建 + 上传到服务器
# 用法: bash deploy-frontend.sh [server_ip]
# 示例: bash deploy-frontend.sh root@你的服务器IP

SERVER="${1:-root@your-server-ip}"
REMOTE_DIR="/www/wwwroot/cang-ai-web"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

cd "$(dirname "$0")"

echo "━━━ CANG-AI 前端部署（本地构建模式）━━━"
echo "  服务器: $SERVER"
echo "  远程目录: $REMOTE_DIR"
echo ""

# 1. 本地构建
echo "[1/4] 本地构建..."
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://vxvx.eu.cc}"
npm run build || { echo "✗ 构建失败"; exit 1; }

# 2. 准备上传目录
echo "[2/4] 打包 standalone..."
rm -rf .deploy
mkdir -p .deploy

# standalone 输出
cp -r .next/standalone/* .deploy/
# 静态资源
mkdir -p .deploy/.next/static
cp -r .next/static/* .deploy/.next/static/
# public 目录
[ -d public ] && cp -r public .deploy/public

echo "  大小: $(du -sh .deploy | cut -f1)"

# 3. 上传到服务器
echo "[3/4] 上传到服务器..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR"
rsync -avz --delete \
    --exclude='node_modules' \
    .deploy/ "$SERVER:$REMOTE_DIR/" \
    || { echo "✗ 上传失败"; exit 1; }

# 4. 远程重启
echo "[4/4] 重启服务..."
ssh "$SERVER" "
    export PATH=/www/server/nodejs/v24.15.0/bin:/usr/local/bin:\$PATH
    cd $REMOTE_DIR
    
    # 写入启动脚本
    cat > start.sh << 'EOF'
#!/bin/bash
export PORT=${FRONTEND_PORT:-3000}
export HOSTNAME=0.0.0.0
exec node server.js
EOF
    chmod +x start.sh
    
    # PM2 重启
    if command -v pm2 &>/dev/null; then
        pm2 delete cang-ai-web 2>/dev/null || true
        pm2 start start.sh --name cang-ai-web --cwd $REMOTE_DIR
        pm2 save
        echo '✓ PM2 已重启'
    else
        echo '⚠ 请手动运行: cd $REMOTE_DIR && bash start.sh'
    fi
"

# 清理
rm -rf .deploy

echo ""
echo "━━━ 部署完成 ✓ ━━━"
echo "  前端: https://vxvx.eu.cc"
