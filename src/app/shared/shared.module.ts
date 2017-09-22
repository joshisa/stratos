import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../core/core.module';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { StepComponent } from './components/stepper/step/step.component';
import { SteppersComponent } from './components/stepper/steppers/steppers.component';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    SteppersComponent,
    StepComponent,
    LoadingPageComponent,
    PageHeaderComponent
  ],
  exports: [
    SteppersComponent,
    StepComponent,
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    PageHeaderComponent
  ]
})
export class SharedModule { }
