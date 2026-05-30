-- Cropware Farm - expande presets de categorias (15 -> 52) com grupos visuais.
--
-- Decisao 2026-05-30: cobertura ampla pra atender os varios tipos de CC
-- (Fazenda, Pessoal, Escritorio, RDV/Viagem, Geral). Tambem corrige
-- acentos e Title Case que faltavam no seed original V1.
--
-- Phase 2 (proxima sessao): categorias personalizadas por usuario
-- (created_by_user_id + RLS individual + UI em /conta).

alter table public.farm_categories
  add column if not exists group_name text;

-- Renomeia + aplica group_name nas 15 existentes
update public.farm_categories set name = 'Combustível', group_name = 'Fazenda' where slug = 'combustivel';
update public.farm_categories set name = 'Defensivos', group_name = 'Fazenda' where slug = 'defensivos';
update public.farm_categories set name = 'Sementes', group_name = 'Fazenda' where slug = 'sementes';
update public.farm_categories set name = 'Fertilizantes', group_name = 'Fazenda' where slug = 'fertilizantes';
update public.farm_categories set name = 'Manutenção', group_name = 'Fazenda' where slug = 'manutencao';
update public.farm_categories set name = 'Peças', group_name = 'Fazenda' where slug = 'pecas';
update public.farm_categories set name = 'Frete', group_name = 'Fazenda' where slug = 'frete';
update public.farm_categories set name = 'Serviços', group_name = 'Fazenda' where slug = 'servicos';
update public.farm_categories set name = 'Alimentação', group_name = 'Pessoal' where slug = 'alimentacao';
update public.farm_categories set name = 'Arrendamento', group_name = 'Fazenda' where slug = 'arrendamento';
update public.farm_categories set name = 'Folha de Pagamento', group_name = 'Fazenda' where slug = 'folha';
update public.farm_categories set name = 'Outras Despesas', group_name = 'Financeiro' where slug = 'outros_despesa';
update public.farm_categories set name = 'Venda de Grãos', group_name = 'Receitas' where slug = 'venda_graos';
update public.farm_categories set name = 'Venda de Gado', group_name = 'Receitas' where slug = 'venda_gado';
update public.farm_categories set name = 'Outras Receitas', group_name = 'Receitas' where slug = 'outros_receita';

-- 37 novos presets
insert into public.farm_categories (slug, name, direction, is_preset, icon_lucide, group_name) values
  -- Fazenda (4)
  ('veterinario',         'Veterinário',           'expense', true, 'stethoscope',    'Fazenda'),
  ('racao_animal',        'Ração Animal',          'expense', true, 'wheat',          'Fazenda'),
  ('analise_solo',        'Análise de Solo',       'expense', true, 'flask-conical',  'Fazenda'),
  ('insumos_agricolas',   'Insumos Agrícolas',     'expense', true, 'package',        'Fazenda'),
  -- Pessoal (9)
  ('mercado',             'Mercado',               'expense', true, 'shopping-cart',  'Pessoal'),
  ('restaurantes',        'Restaurantes',          'expense', true, 'utensils',       'Pessoal'),
  ('saude',               'Saúde',                 'expense', true, 'heart-pulse',    'Pessoal'),
  ('farmacia',            'Farmácia',              'expense', true, 'pill',           'Pessoal'),
  ('educacao',            'Educação',              'expense', true, 'graduation-cap', 'Pessoal'),
  ('lazer',               'Lazer',                 'expense', true, 'party-popper',   'Pessoal'),
  ('vestuario',           'Vestuário',             'expense', true, 'shirt',          'Pessoal'),
  ('aluguel',             'Aluguel',               'expense', true, 'home',           'Pessoal'),
  ('condominio',          'Condomínio',            'expense', true, 'building',       'Pessoal'),
  -- Escritorio (8)
  ('energia',             'Energia',               'expense', true, 'zap',            'Escritório'),
  ('agua',                'Água',                  'expense', true, 'droplets',       'Escritório'),
  ('internet',            'Internet',              'expense', true, 'wifi',           'Escritório'),
  ('telefone',            'Telefone',              'expense', true, 'phone',          'Escritório'),
  ('material_escritorio', 'Material de Escritório', 'expense', true, 'pen-tool',      'Escritório'),
  ('limpeza',             'Limpeza',               'expense', true, 'spray-can',      'Escritório'),
  ('software',            'Software',              'expense', true, 'laptop',         'Escritório'),
  ('contador',            'Contador',              'expense', true, 'calculator',     'Escritório'),
  -- Viagem / RDV (4)
  ('hospedagem',          'Hospedagem',            'expense', true, 'bed',            'Viagem'),
  ('pedagio',             'Pedágio',               'expense', true, 'milestone',      'Viagem'),
  ('estacionamento',      'Estacionamento',        'expense', true, 'square-parking', 'Viagem'),
  ('transporte',          'Transporte',            'expense', true, 'car',            'Viagem'),
  -- Financeiro / Geral (8)
  ('impostos',            'Impostos',              'expense', true, 'landmark',       'Financeiro'),
  ('taxas_bancarias',     'Taxas Bancárias',       'expense', true, 'banknote',       'Financeiro'),
  ('juros',               'Juros',                 'expense', true, 'percent',        'Financeiro'),
  ('seguros',             'Seguros',               'expense', true, 'shield',         'Financeiro'),
  ('marketing',           'Marketing',             'expense', true, 'megaphone',      'Financeiro'),
  ('doacoes',             'Doações',               'expense', true, 'hand-heart',     'Financeiro'),
  ('multas',              'Multas',                'expense', true, 'alert-octagon',  'Financeiro'),
  ('investimento',        'Investimento',          'expense', true, 'trending-up',    'Financeiro'),
  -- Receitas (4)
  ('prestacao_servicos',  'Prestação de Serviços', 'income',  true, 'briefcase',      'Receitas'),
  ('reembolso',           'Reembolso',             'income',  true, 'rotate-ccw',     'Receitas'),
  ('aluguel_recebido',    'Aluguel Recebido',      'income',  true, 'home',           'Receitas'),
  ('juros_recebidos',     'Juros Recebidos',       'income',  true, 'trending-up',    'Receitas');
