import { init } from './actions/init';
import { create } from './actions/create';
import { up } from './actions/up';

export const initAction = async () => {
    return init();
};

export const createAction = async (description: string) => {
    return create(description);
};

export const upAction = async () => {
    return up();
};
