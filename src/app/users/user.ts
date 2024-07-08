import {
  IdEntity,
  Entity,
  Validators,
  isBackend,
  Allow,
  Fields,
  BackendMethod,
  Remult,
  remult,
} from 'remult'
import { Roles } from './roles'
import { terms } from '../terms'
import { DataControl } from '../common-ui-elements/interfaces/src/data-control-interfaces'
import { UITools } from '../common/UITools'

@Entity<User>('Users', {
  allowApiRead: Allow.authenticated,
  allowApiUpdate: Allow.authenticated,
  allowApiDelete: false,
  allowApiInsert: Roles.admin,
  apiPrefilter: () =>
    !remult.isAllowed(Roles.admin) ? { id: [remult.user?.id!] } : {},
  saving: async (user) => {
    if (isBackend()) {
      if (user._.isNew()) {
        user.createDate = new Date()
      }
    }
  },
})
export class User extends IdEntity {
  @Fields.string({
    validate: [Validators.required, Validators.uniqueOnBackend, (user) => {
      if (user.name.length < 3) throw "Too Short!!!"
    }],
    caption: terms.username,
  })
  name = ''
  
  @Fields.string({ includeInApi: false })
  password = ''
  @Fields.date({
    allowApiUpdate: false,
  })
  createDate = new Date()

  // allowApiUpdate: Roles.admin,
  @Fields.boolean({
    allowApiUpdate: (u) => {
      console.log('remult?.user?.id', remult?.user?.id)
      console.log('u.id', u.id)
      return remult?.user?.id != u.id;
    },
    // allowApiUpdate: (u) =>  remult?.user?.id != u.id,
    caption: terms.admin,
  })
  admin = false

  @Fields.boolean({

    allowApiUpdate: Roles.admin,
    caption: terms.disabled,
    // validate: Validators.required,
  })
  disabled = false

  async hashAndSetPassword(password: string) {
    this.password = (await import('password-hash')).generate(password)
  }
  async passwordMatches(password: string) {
    return (
      !this.password ||
      (await import('password-hash')).verify(password, this.password)
    )
  }

  editDialog(ui: UITools, onOk?: () => void) {
    const v = this
    ui.areaDialog({
      title: 'פרטי משתמש',
      fields: [
        v.$.name,
        v.$.admin,
      ],
      ok: async () => {
        await v.save()
        ui.info('נשמר בהצלחה');
        onOk?.()
      },
    })
  }
  @BackendMethod({ allowed: Roles.admin })
  async resetPassword() {
    this.password = ''
    await this.save()
  }
}
