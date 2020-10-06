import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { isPassword } from '../validations'
import { Auth } from '../authentication/state'
import { clientGateway } from '../constants'
import Button from '../components/Button'
import { BarLoader } from 'react-spinners'
import styles from './shared.module.scss'
import Input from '../components/Input'
import { faChevronLeft } from '@fortawesome/pro-solid-svg-icons'
import { useMedia } from 'react-use'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

type validateFormData = { newPassword: string; oldPassword: string }

const validatePassword = (values: validateFormData) => {
  const errors: { oldPassword?: string; newPassword?: string } = {}
  if (!isPassword(values.newPassword))
    errors.newPassword = 'A valid password is required'
  if (!isPassword(values.oldPassword))
    errors.oldPassword = 'A valid password is required'
  return errors
}

type UserResponse = {
  id: string
  avatar: string
  username: string
  discriminator: number
}

const Security = ({ setPage }: { setPage: Function }) => {
  const { token, id } = Auth.useContainer()
  const isMobile = useMedia('(max-width: 800px)')

  return (
    <div className={styles.wrapper}>
      <h2 onClick={() => isMobile && setPage('')}>
        {isMobile && (
          <FontAwesomeIcon className={styles.backButton} icon={faChevronLeft} />
        )}
        Security
      </h2>
      <Formik
        initialValues={{ oldPassword: '', newPassword: '' }}
        validate={validatePassword}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            await clientGateway.patch(
              `/users/${id}`,
              new URLSearchParams({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
              }),
              {
                headers: {
                  authorization: token
                }
              }
            )
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <h3>Change Password</h3>
            <label htmlFor='oldPassword' className={styles.inputName}>
              Current Password
            </label>
            <Field component={Input} name='oldPassword' type={'password'} />
            <ErrorMessage component='p' name='oldPassword' />
            <label htmlFor='newPassword' className={styles.inputName}>
              New Password
            </label>
            <Field component={Input} name='newPassword' type={'password'} />
            <ErrorMessage component='p' name='newPassword' />
            <Button disabled={isSubmitting} type='submit'>
              {isSubmitting ? <BarLoader color='#ffffff' /> : 'Change Password'}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default Security