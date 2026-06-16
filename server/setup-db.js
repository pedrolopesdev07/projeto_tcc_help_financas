import prisma from './src/models/prismaClient.js';

async function setupDatabase() {
  try {
    console.log('🔧 Sincronizando schema com Supabase...\n');
    
    // Testar conexão
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexão com Supabase estabelecida!');
    
    // Habilitar extensão UUID
    console.log('\n📦 Configurando extensões...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('  ✔️ Extensão uuid-ossp habilitada');
    
    // Dropas todas as tabelas primeiro
    console.log('\n🗑️ Removendo tabelas antigas (se houver)...');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS orcamentos CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS metas CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS transacoes CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS categorias CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS perfis_financeiros CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS refresh_tokens CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS usuarios CASCADE');
    console.log('  ✔️ Tabelas antigas removidas');
    
    // Criar tabelas
    console.log('\n📦 Criando tabelas com schema correto...');
    
    // usuarios
    await prisma.$executeRawUnsafe(`
      CREATE TABLE usuarios (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        renda_mensal DECIMAL(10,2),
          estrategia_financeira VARCHAR(50) DEFAULT '50-30-20',
        onboarding_concluido BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('  ✔️ Tabela usuarios criada');
    
    // perfis_financeiros
    await prisma.$executeRawUnsafe(`
      CREATE TABLE perfis_financeiros (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
          objetivo_principal VARCHAR(100),
          perfil_consumidor VARCHAR(100),
          dependentes INT DEFAULT 0,
        config_estrategia JSONB,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('  ✔️ Tabela perfis_financeiros criada');
    
    // categorias
    await prisma.$executeRawUnsafe(`
      CREATE TABLE categorias (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
          tipo VARCHAR(10) NOT NULL CONSTRAINT chk_tipo_categoria CHECK (tipo IN ('receita', 'despesa')),
          grupo_estrategia VARCHAR(20) CONSTRAINT chk_grupo_estrategia CHECK (grupo_estrategia IN ('essencial', 'desejo', 'prioridade')),
        icone TEXT,
        cor TEXT,
        eh_padrao BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('  ✔️ Tabela categorias criada');
    
    // transacoes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE transacoes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
          categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
          tipo VARCHAR(10) NOT NULL CONSTRAINT chk_tipo_transacao CHECK (tipo IN ('receita', 'despesa')),
          valor DECIMAL(10,2) NOT NULL CONSTRAINT chk_valor_positivo CHECK (valor > 0),
        descricao TEXT,
          data DATE NOT NULL DEFAULT CURRENT_DATE,
          recorrencia VARCHAR(20) DEFAULT 'nenhuma' CONSTRAINT chk_recorrencia CHECK (recorrencia IN ('nenhuma', 'semanal', 'mensal')),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('  ✔️ Tabela transacoes criada');
    
    // metas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE metas (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
          tipo_meta VARCHAR(50) CONSTRAINT chk_tipo_meta CHECK (tipo_meta IN ('reserva_emergencia', 'objetivo_compra', 'quitacao_divida', 'investimento')),
        valor_total DECIMAL(10,2) NOT NULL,
          valor_atual DECIMAL(10,2) DEFAULT 0,
          data_limite DATE,
          status VARCHAR(20) DEFAULT 'ativa' CONSTRAINT chk_status_meta CHECK (status IN ('ativa', 'pausada', 'concluida', 'arquivada')),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('  ✔️ Tabela metas criada');
    
    // orcamentos
    await prisma.$executeRawUnsafe(`
      CREATE TABLE orcamentos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
          mes INT NOT NULL CONSTRAINT chk_mes CHECK (mes BETWEEN 1 AND 12),
        ano INT NOT NULL,
          estrategia VARCHAR(50) NOT NULL,
          limite_essencial DECIMAL(10,2),
          limite_desejo DECIMAL(10,2),
          limite_prioridade DECIMAL(10,2),
        config_personalizada JSONB,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unica_combinacao_usuario_mes_ano UNIQUE(usuario_id, mes, ano)
      )
    `);
    console.log('  ✔️ Tabela orcamentos criada');
    
    // refresh_tokens
    await prisma.$executeRawUnsafe(`
      CREATE TABLE refresh_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_em TIMESTAMP WITH TIME ZONE NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('  ✔️ Tabela refresh_tokens criada');
    
    console.log('\n✅ Todas as tabelas foram criadas com sucesso!');
    console.log('🎉 Database pronto para usar!\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao configurar banco:', error.message);
      if (error.code === 'P1000' || error.code === '42P07') {
        console.error('\n⚠️ Dica:');
        if (error.code === '42P07') {
          console.error('  As tabelas já existem. Você precisa dropa-las manualmente ou executar novamente.');
        } else {
          console.error('  Verificar se credenciais do Supabase estão corretas');
          console.error('  Há restrição de IP no Supabase?');
          console.error('  Conexão de internet está ativa?');
        }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
