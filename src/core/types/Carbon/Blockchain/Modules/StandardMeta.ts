import { SmallString } from '../../SmallString.js';

export const StandardMeta = {
  id: new SmallString('_i'),
  Chain: {
    address: new SmallString('_a'),
    name: new SmallString('_n'),
    nexus: new SmallString('_x'),
    tokenomics: new SmallString('_t'),
  },
  Token: {
    staking_org_id: new SmallString('_soi'),
    staking_org_threshold: new SmallString('_sot'),
    staking_reward_token: new SmallString('_srt'),
    staking_reward_period: new SmallString('_srp'),
    staking_reward_mul: new SmallString('_srm'),
    staking_reward_div: new SmallString('_srd'),
    staking_lock: new SmallString('_sl'),
    staking_booster_token: new SmallString('_sbt'),
    staking_booster_mul: new SmallString('_sbm'),
    staking_booster_div: new SmallString('_sbd'),
    staking_booster_limit: new SmallString('_sbl'),
    phantasma_script: new SmallString('_phs'),
    phantasma_abi: new SmallString('_phb'),
    pre_burn: new SmallString('_brn'),
  },
} as const;
